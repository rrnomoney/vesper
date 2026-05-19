package com.vesper.backend.controller;

import com.vesper.backend.common.Result;
import com.vesper.backend.service.BarService;
import com.vesper.backend.vo.BarVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bars")
public class BarController {

    private final BarService barService;

    @GetMapping
    public Result<List<BarVO>> listBars() {
        return Result.success(barService.listBars());
    }

    @GetMapping("/{id}")
    public Result<BarVO> getBarById(@PathVariable Long id) {
        return Result.success(barService.getBarById(id));
    }
}
