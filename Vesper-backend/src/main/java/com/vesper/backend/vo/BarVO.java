package com.vesper.backend.vo;

import com.vesper.backend.entity.Bar;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
        vo.setRating(bar.getRating());
        vo.setPriceLevel(bar.getPriceLevel());
        vo.setCoverImage(bar.getCoverImage());
        vo.setCreatedAt(bar.getCreatedAt());
        vo.setUpdatedAt(bar.getUpdatedAt());
        return vo;
    }
}
