package com.vesper.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.service.PoiService;
import com.vesper.backend.vo.PoiVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AmapPoiServiceImpl implements PoiService {

    private static final String AMAP_AROUND_URL = "https://restapi.amap.com/v3/place/around";
    private static final String BAR_KEYWORDS = "酒吧|清吧|cocktail|pub|livehouse";

    private final RestTemplate restTemplate;

    @Value("${amap.api-key:}")
    private String amapApiKey;

    @Override
    public List<PoiVO> listNearbyBars(BigDecimal latitude, BigDecimal longitude) {
        if (!StringUtils.hasText(amapApiKey)) {
            throw new BusinessException(500, "AMap API key is not configured");
        }

        URI uri = UriComponentsBuilder.fromUriString(AMAP_AROUND_URL)
                .queryParam("key", amapApiKey)
                .queryParam("location", longitude + "," + latitude)
                .queryParam("keywords", BAR_KEYWORDS)
                .queryParam("radius", 5000)
                .queryParam("offset", 25)
                .queryParam("page", 1)
                .queryParam("extensions", "base")
                .build()
                .encode()
                .toUri();

        try {
            JsonNode response = restTemplate.getForObject(uri, JsonNode.class);
            if (response == null || !"1".equals(response.path("status").asText())) {
                throw new BusinessException(502, "Unable to load nearby bars");
            }

            List<PoiVO> pois = new ArrayList<>();
            for (JsonNode poiNode : response.path("pois")) {
                parsePoi(poiNode).ifPresent(pois::add);
            }
            return pois;
        } catch (RestClientException exception) {
            throw new BusinessException(502, "Unable to load nearby bars");
        }
    }

    private java.util.Optional<PoiVO> parsePoi(JsonNode poiNode) {
        String location = poiNode.path("location").asText("");
        String[] parts = location.split(",");
        if (parts.length != 2) {
            return java.util.Optional.empty();
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
            return java.util.Optional.of(poi);
        } catch (NumberFormatException exception) {
            return java.util.Optional.empty();
        }
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
}
