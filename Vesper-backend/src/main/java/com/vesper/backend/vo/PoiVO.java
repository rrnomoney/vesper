package com.vesper.backend.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PoiVO {

    private String id;

    private Long localBarId;

    private String name;

    private String address;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String category;

    private Integer distance;

    private String coverImage;

    private BigDecimal rating;

    private BigDecimal averageRating;

    private Integer reviewCount;
}
