package com.vesper.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ImportPoiRequest {

    @NotBlank
    @Size(max = 100)
    private String externalId;

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String address;

    @NotNull
    @DecimalMin("-90")
    @DecimalMax("90")
    private BigDecimal latitude;

    @NotNull
    @DecimalMin("-180")
    @DecimalMax("180")
    private BigDecimal longitude;

    @Size(max = 100)
    private String category;

    @Size(max = 500)
    private String coverImage;
}
