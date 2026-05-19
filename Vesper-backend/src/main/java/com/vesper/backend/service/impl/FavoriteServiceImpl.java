package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.entity.Bar;
import com.vesper.backend.entity.Favorite;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.BarMapper;
import com.vesper.backend.mapper.FavoriteMapper;
import com.vesper.backend.service.FavoriteService;
import com.vesper.backend.vo.BarVO;
import com.vesper.backend.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteMapper favoriteMapper;
    private final BarMapper barMapper;

    @Override
    @Transactional
    public void addFavorite(Long barId) {
        Long userId = currentUserId();
        ensureBarExists(barId);

        Long count = favoriteMapper.selectCount(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getBarId, barId));
        if (count > 0) {
            return;
        }

        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setBarId(barId);
        favoriteMapper.insert(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(Long barId) {
        Long userId = currentUserId();

        favoriteMapper.delete(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getBarId, barId));
    }

    @Override
    public List<BarVO> listFavorites() {
        Long userId = currentUserId();
        List<Long> barIds = favoriteMapper.selectList(new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .orderByDesc(Favorite::getCreatedAt))
                .stream()
                .map(Favorite::getBarId)
                .toList();

        if (barIds.isEmpty()) {
            return Collections.emptyList();
        }

        return barMapper.selectBatchIds(barIds)
                .stream()
                .map(BarVO::from)
                .toList();
    }

    private void ensureBarExists(Long barId) {
        Bar bar = barMapper.selectById(barId);
        if (bar == null) {
            throw new BusinessException(400, "Bar does not exist");
        }
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserVO user)) {
            throw new BusinessException(401, "Unauthorized");
        }
        return user.getId();
    }
}
