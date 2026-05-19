package com.vesper.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("bars")
public class Bar {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String externalId;

    private String name;

    private String city;

    private String address;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String category;

    private BigDecimal rating;

    private Integer priceLevel;

    private String coverImage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
