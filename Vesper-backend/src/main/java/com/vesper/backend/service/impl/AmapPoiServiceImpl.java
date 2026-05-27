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
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class AmapPoiServiceImpl implements PoiService {

    private static final String AMAP_AROUND_URL = "https://restapi.amap.com/v3/place/around";
    private static final String AMAP_DETAIL_URL = "https://restapi.amap.com/v3/place/detail";
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
        log.info("importPoi called");
        String externalId = request.getExternalId().trim();
        Bar existingBar = barMapper.selectOne(new LambdaQueryWrapper<Bar>()
                .eq(Bar::getExternalId, externalId)
                .last("LIMIT 1"));
        if (existingBar != null) {
            if (!hasMissingObjectiveEnrichment(existingBar)) {
                log.info("existing bar already enriched, skip AMap detail");
                return BarVO.from(existingBar);
            }

            log.info("existing bar missing enrichment");
            enrichBarWithAmapDetail(existingBar, externalId, true);
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
        enrichBarWithAmapDetail(bar, externalId, false);
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

    private void enrichBarWithAmapDetail(Bar bar, String externalId, boolean persistExistingBar) {
        log.info("fetching AMap detail");
        Optional<AmapPoiDetail> detail = fetchPoiDetail(externalId);
        if (detail.isEmpty() || !detail.get().hasObjectiveFields()) {
            log.info("AMap detail no objective fields");
            return;
        }

        applyPoiDetail(bar, detail.get());
        if (persistExistingBar) {
            barMapper.updateById(bar);
        }
    }

    private Optional<AmapPoiDetail> fetchPoiDetail(String externalId) {
        if (!StringUtils.hasText(amapApiKey)) {
            return Optional.empty();
        }

        try {
            URI uri = UriComponentsBuilder.fromUriString(AMAP_DETAIL_URL)
                    .queryParam("key", amapApiKey)
                    .queryParam("id", externalId)
                    .queryParam("extensions", "all")
                    .build()
                    .encode()
                    .toUri();

            JsonNode response = restTemplate.getForObject(uri, JsonNode.class);
            logAmapDetailSummary(response);
            if (response == null || !"1".equals(response.path("status").asText())) {
                log.info("AMap detail failed, status={}, info={}, infocode={}",
                        response == null ? null : response.path("status").asText(null),
                        response == null ? null : response.path("info").asText(null),
                        response == null ? null : response.path("infocode").asText(null));
                return Optional.empty();
            }

            return firstPoiDetailNode(response).map(this::parsePoiDetail);
        } catch (RuntimeException exception) {
            log.info("AMap detail failed, reason={}", exception.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    private Optional<JsonNode> firstPoiDetailNode(JsonNode response) {
        JsonNode pois = response.path("pois");
        if (pois.isArray() && !pois.isEmpty()) {
            return Optional.of(pois.get(0));
        }

        JsonNode poi = response.path("poi");
        if (poi.isObject()) {
            return Optional.of(poi);
        }

        JsonNode resultPoi = response.path("result").path("poi");
        if (resultPoi.isObject()) {
            return Optional.of(resultPoi);
        }

        return Optional.empty();
    }

    private AmapPoiDetail parsePoiDetail(JsonNode poiNode) {
        JsonNode business = poiNode.path("business");
        JsonNode bizExt = poiNode.path("biz_ext");

        String phone = firstText(
                poiNode.path("tel"),
                business.path("tel"));
        String businessHours = firstText(
                poiNode.path("opentime_week"),
                poiNode.path("opentime"),
                bizExt.path("open_time"),
                business.path("open_time"),
                business.path("opentime_week"),
                business.path("opentime"),
                poiNode.path("opening_hours"),
                poiNode.path("open_time"),
                poiNode.path("business_hours"),
                poiNode.path("hours"),
                poiNode.path("opentime_today"),
                bizExt.path("opening_hours"),
                bizExt.path("business_hours"),
                bizExt.path("hours"),
                business.path("opening_hours"),
                business.path("business_hours"),
                business.path("hours"),
                business.path("opentime_today"));
        String formattedAddress = firstText(poiNode.path("address"));
        String poiType = firstText(poiNode.path("type"));
        String website = firstText(poiNode.path("website"));
        List<String> photoUrls = parsePhotoUrls(poiNode.path("photos"));

        return new AmapPoiDetail(phone, businessHours, formattedAddress, poiType, website, photoUrls);
    }

    private void applyPoiDetail(Bar bar, AmapPoiDetail detail) {
        if (!StringUtils.hasText(bar.getPhone()) && StringUtils.hasText(detail.phone())) {
            bar.setPhone(detail.phone());
        }
        if (!StringUtils.hasText(bar.getBusinessHours()) && StringUtils.hasText(detail.businessHours())) {
            bar.setBusinessHours(detail.businessHours());
        }
        if (!StringUtils.hasText(bar.getFormattedAddress()) && StringUtils.hasText(detail.formattedAddress())) {
            bar.setFormattedAddress(detail.formattedAddress());
        }
        if (!StringUtils.hasText(bar.getPoiType()) && StringUtils.hasText(detail.poiType())) {
            bar.setPoiType(detail.poiType());
        }
        if (!StringUtils.hasText(bar.getWebsite()) && StringUtils.hasText(detail.website())) {
            bar.setWebsite(detail.website());
        }
        if (!StringUtils.hasText(bar.getAmapPhotoUrls()) && !detail.photoUrls().isEmpty()) {
            bar.setAmapPhotoUrls(String.join("\n", detail.photoUrls()));
        }
    }

    private boolean hasMissingObjectiveEnrichment(Bar bar) {
        return !StringUtils.hasText(bar.getPhone())
                || !StringUtils.hasText(bar.getBusinessHours())
                || !StringUtils.hasText(bar.getFormattedAddress())
                || !StringUtils.hasText(bar.getPoiType())
                || !StringUtils.hasText(bar.getWebsite())
                || !StringUtils.hasText(bar.getAmapPhotoUrls());
    }

    private String firstText(JsonNode... nodes) {
        for (JsonNode node : nodes) {
            String text = textOrNull(node);
            if (StringUtils.hasText(text)) {
                return text;
            }
        }
        return null;
    }

    private List<String> parsePhotoUrls(JsonNode photosNode) {
        if (!photosNode.isArray()) {
            return List.of();
        }

        List<String> urls = new ArrayList<>();
        for (JsonNode photoNode : photosNode) {
            String url = firstText(photoNode.path("url"), photoNode.path("image_url"));
            if (StringUtils.hasText(url) && !urls.contains(url)) {
                urls.add(url);
            }
        }
        return urls;
    }

    private void logAmapDetailSummary(JsonNode response) {
        if (response == null) {
            log.info("AMap detail summary status=null");
            return;
        }

        Optional<JsonNode> firstPoi = firstPoiDetailNode(response);
        JsonNode poi = firstPoi.orElse(null);
        JsonNode bizExt = poi == null ? null : poi.path("biz_ext");
        JsonNode business = poi == null ? null : poi.path("business");
        JsonNode photos = poi == null ? null : poi.path("photos");

        log.info(
                "AMap detail summary status={}, info={}, infocode={}, count={}, poiKeys={}, address={}, type={}, tel={}, website={}, opentime={}, opentime_week={}, business_area={}, bizExtKeys={}, bizExtOpenTime={}, businessKeys={}, businessOpenTime={}, photosSize={}",
                response.path("status").asText(null),
                response.path("info").asText(null),
                response.path("infocode").asText(null),
                response.path("count").asText(null),
                poi == null ? List.of() : fieldNames(poi),
                poi == null ? null : textOrNull(poi.path("address")),
                poi == null ? null : textOrNull(poi.path("type")),
                poi == null ? null : textOrNull(poi.path("tel")),
                poi == null ? null : textOrNull(poi.path("website")),
                poi == null ? null : textOrNull(poi.path("opentime")),
                poi == null ? null : textOrNull(poi.path("opentime_week")),
                poi == null ? null : textOrNull(poi.path("business_area")),
                bizExt == null || !bizExt.isObject() ? List.of() : fieldNames(bizExt),
                bizExt == null ? null : textOrNull(bizExt.path("open_time")),
                business == null || !business.isObject() ? List.of() : fieldNames(business),
                business == null ? null : textOrNull(business.path("open_time")),
                photos != null && photos.isArray() ? photos.size() : 0);
    }

    private List<String> fieldNames(JsonNode node) {
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
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

    private record AmapPoiDetail(
            String phone,
            String businessHours,
            String formattedAddress,
            String poiType,
            String website,
            List<String> photoUrls
    ) {
        private boolean hasObjectiveFields() {
            return StringUtils.hasText(phone)
                    || StringUtils.hasText(businessHours)
                    || StringUtils.hasText(formattedAddress)
                    || StringUtils.hasText(poiType)
                    || StringUtils.hasText(website)
                    || !photoUrls.isEmpty();
        }
    }
}
