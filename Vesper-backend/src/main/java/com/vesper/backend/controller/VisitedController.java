package com.vesper.backend.controller;

import com.vesper.backend.common.Result;
import com.vesper.backend.service.VisitedService;
import com.vesper.backend.vo.BarVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/visited")
public class VisitedController {

    private final VisitedService visitedService;

    @PostMapping("/{barId}")
    public Result<Void> addVisited(@PathVariable Long barId) {
        visitedService.addVisited(barId);
        return Result.success();
    }

    @DeleteMapping("/{barId}")
    public Result<Void> removeVisited(@PathVariable Long barId) {
        visitedService.removeVisited(barId);
        return Result.success();
    }

    @GetMapping
    public Result<List<BarVO>> listVisited() {
        return Result.success(visitedService.listVisited());
    }
}
