package com.vesper.backend.controller;

import com.vesper.backend.common.Result;
import com.vesper.backend.service.PoiService;
import com.vesper.backend.vo.PoiVO;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/pois")
public class PoiController {

    private final PoiService poiService;

    @GetMapping("/nearby-bars")
    public Result<List<PoiVO>> listNearbyBars(
            @RequestParam("lat") @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
            @RequestParam("lng") @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude
    ) {
        return Result.success(poiService.listNearbyBars(latitude, longitude));
    }
}
