package com.vesper.backend.controller;

import com.vesper.backend.common.Result;
import com.vesper.backend.service.FavoriteService;
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
@RequestMapping("/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/{barId}")
    public Result<Void> addFavorite(@PathVariable Long barId) {
        favoriteService.addFavorite(barId);
        return Result.success();
    }

    @DeleteMapping("/{barId}")
    public Result<Void> removeFavorite(@PathVariable Long barId) {
        favoriteService.removeFavorite(barId);
        return Result.success();
    }

    @GetMapping
    public Result<List<BarVO>> listFavorites() {
        return Result.success(favoriteService.listFavorites());
    }
}
