package com.vesper.backend.service;

import com.vesper.backend.vo.BarVO;

import java.util.List;

public interface FavoriteService {

    void addFavorite(Long barId);

    void removeFavorite(Long barId);

    List<BarVO> listFavorites();
}
