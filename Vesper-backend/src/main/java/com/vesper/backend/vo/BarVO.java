package com.vesper.backend.vo;

import com.vesper.backend.entity.Bar;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Data
public class BarVO {

    private Long id;

    private String externalId;

    private String name;

    private String city;

    private String address;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String category;

    private String phone;

    private String businessHours;

    private String formattedAddress;

    private String poiType;

    private String website;

    private List<String> amapPhotoUrls;

    private BigDecimal rating;

    private BigDecimal averageRating;

    private Integer reviewCount;

    private Integer priceLevel;

    private String coverImage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static BarVO from(Bar bar) {
        BarVO vo = new BarVO();
        vo.setId(bar.getId());
        vo.setExternalId(bar.getExternalId());
        vo.setName(bar.getName());
        vo.setCity(bar.getCity());
        vo.setAddress(bar.getAddress());
        vo.setLatitude(bar.getLatitude());
        vo.setLongitude(bar.getLongitude());
        vo.setCategory(bar.getCategory());
        vo.setPhone(bar.getPhone());
        vo.setBusinessHours(bar.getBusinessHours());
        vo.setFormattedAddress(bar.getFormattedAddress());
        vo.setPoiType(bar.getPoiType());
        vo.setWebsite(bar.getWebsite());
        vo.setAmapPhotoUrls(parsePhotoUrls(bar.getAmapPhotoUrls()));
        vo.setRating(bar.getRating());
        vo.setPriceLevel(bar.getPriceLevel());
        vo.setCoverImage(bar.getCoverImage());
        vo.setCreatedAt(bar.getCreatedAt());
        vo.setUpdatedAt(bar.getUpdatedAt());
        return vo;
    }

    private static List<String> parsePhotoUrls(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split("\\n"))
                .map(String::trim)
                .filter(url -> !url.isBlank())
                .distinct()
                .toList();
    }
}
