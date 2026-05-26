package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.vesper.backend.dto.ImportPoiRequest;
import com.vesper.backend.entity.Bar;
import com.vesper.backend.entity.Review;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.BarMapper;
import com.vesper.backend.mapper.ReviewMapper;
import com.vesper.backend.service.PoiService;
import com.vesper.backend.vo.BarVO;
import com.vesper.backend.vo.PoiVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AmapPoiServiceImpl implements PoiService {

    private static final String AMAP_AROUND_URL = "https://restapi.amap.com/v3/place/around";
    private static final String BAR_KEYWORDS = "\u9152\u5427|\u6e05\u5427|cocktail|pub|livehouse|\u7cbe\u917f|\u5a01\u58eb\u5fcc";
    private static final List<String> CATEGORY_ALLOWLIST = List.of(
            "\u9152\u5427",
            "\u6e05\u5427",
            "cocktail",
            "pub",
            "livehouse",
            "night club",
            "\u7cbe\u917f",
            "\u5a01\u58eb\u5fcc",
            "\u591c\u603b\u4f1a",
            "\u5a31\u4e50"
    );
    private static final List<String> CATEGORY_BLOCKLIST = List.of(
            "\u8d2d\u7269",
            "\u5ba0\u7269",
            "\u5bb6\u5177",
            "\u9152\u5e97",
            "\u653f\u5e9c",
            "\u666f\u70b9",
            "\u529e\u516c",
            "\u4fbf\u5229\u5e97",
            "\u516c\u53f8",
            "\u4f4f\u5b85",
            "\u533b\u7597",
            "\u6559\u80b2"
    );

    private final RestTemplate restTemplate;
    private final BarMapper barMapper;
    private final ReviewMapper reviewMapper;

    @Value("${amap.api-key:}")
    private String amapApiKey;

    @Override
    public List<PoiVO> listNearbyBars(BigDecimal latitude, BigDecimal longitude) {
        if (!StringUtils.hasText(amapApiKey)) {
            throw new BusinessException(500, "AMap API key is not configured");
        }

        try {
            List<PoiVO> pois = new ArrayList<>();
            for (int page = 1; page <= 3 && pois.size() < 30; page++) {
                URI uri = UriComponentsBuilder.fromUriString(AMAP_AROUND_URL)
                        .queryParam("key", amapApiKey)
                        .queryParam("location", longitude + "," + latitude)
                        .queryParam("keywords", BAR_KEYWORDS)
                        .queryParam("radius", 8000)
                        .queryParam("offset", 25)
                        .queryParam("page", page)
                        .queryParam("extensions", "base")
                        .build()
                        .encode()
                        .toUri();

                JsonNode response = restTemplate.getForObject(uri, JsonNode.class);
                if (response == null || !"1".equals(response.path("status").asText())) {
                    throw new BusinessException(502, "Unable to load nearby bars");
                }

                for (JsonNode poiNode : response.path("pois")) {
                    parsePoi(poiNode)
                            .filter(this::isRelevantBar)
                            .map(this::mergeLocalBarState)
                            .ifPresent(pois::add);
                }
            }
            return pois;
        } catch (RestClientException exception) {
            throw new BusinessException(502, "Unable to load nearby bars");
        }
    }

    @Override
    @Transactional
    public BarVO importPoi(ImportPoiRequest request) {
        String externalId = request.getExternalId().trim();
        Bar existingBar = barMapper.selectOne(new LambdaQueryWrapper<Bar>()
                .eq(Bar::getExternalId, externalId)
                .last("LIMIT 1"));
        if (existingBar != null) {
            return BarVO.from(existingBar);
        }

        Bar bar = new Bar();
        bar.setExternalId(externalId);
        bar.setName(request.getName().trim());
        bar.setAddress(trimToNull(request.getAddress()));
        bar.setLatitude(request.getLatitude());
        bar.setLongitude(request.getLongitude());
        bar.setCategory(trimToNull(request.getCategory()));
        bar.setCity(null);
        bar.setCoverImage(trimToNull(request.getCoverImage()));
        bar.setRating(BigDecimal.ZERO);
        bar.setPriceLevel(2);
        barMapper.insert(bar);

        Bar savedBar = barMapper.selectById(bar.getId());
        return BarVO.from(savedBar);
    }

    private Optional<PoiVO> parsePoi(JsonNode poiNode) {
        String location = poiNode.path("location").asText("");
        String[] parts = location.split(",");
        if (parts.length != 2) {
            return Optional.empty();
        }

        try {
            PoiVO poi = new PoiVO();
            poi.setId(poiNode.path("id").asText());
            poi.setName(poiNode.path("name").asText());
            poi.setAddress(textOrNull(poiNode.path("address")));
            poi.setLongitude(new BigDecimal(parts[0]));
            poi.setLatitude(new BigDecimal(parts[1]));
            poi.setCategory(textOrNull(poiNode.path("type")));
            poi.setDistance(parseInteger(poiNode.path("distance").asText()));
            poi.setCoverImage(null);
            poi.setRating(null);
            poi.setAverageRating(null);
            poi.setReviewCount(0);
            return Optional.of(poi);
        } catch (NumberFormatException exception) {
            return Optional.empty();
        }
    }

    private boolean isRelevantBar(PoiVO poi) {
        String haystack = ((poi.getName() == null ? "" : poi.getName()) + " "
                + (poi.getCategory() == null ? "" : poi.getCategory()))
                .toLowerCase(Locale.ROOT);

        boolean blocked = CATEGORY_BLOCKLIST.stream().anyMatch(haystack::contains);
        if (blocked) {
            return false;
        }

        return CATEGORY_ALLOWLIST.stream()
                .map(keyword -> keyword.toLowerCase(Locale.ROOT))
                .anyMatch(haystack::contains);
    }

    private String textOrNull(JsonNode node) {
        String text = node.asText("");
        return StringUtils.hasText(text) && !"[]".equals(text) ? text : null;
    }

    private Integer parseInteger(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private PoiVO mergeLocalBarState(PoiVO poi) {
        Bar localBar = barMapper.selectOne(new LambdaQueryWrapper<Bar>()
                .eq(Bar::getExternalId, poi.getId())
                .last("LIMIT 1"));

        if (localBar == null) {
            return poi;
        }

        poi.setLocalBarId(localBar.getId());
        poi.setCoverImage(localBar.getCoverImage());
        poi.setRating(localBar.getRating());

        List<Review> reviews = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getBarId, localBar.getId()));
        poi.setReviewCount(reviews.size());

        if (!reviews.isEmpty()) {
            BigDecimal total = reviews.stream()
                    .map(review -> BigDecimal.valueOf(review.getRating()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            poi.setAverageRating(total.divide(BigDecimal.valueOf(reviews.size()), 1, RoundingMode.HALF_UP));
        }

        return poi;
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
