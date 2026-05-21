package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.entity.Bar;
import com.vesper.backend.entity.Visited;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.BarMapper;
import com.vesper.backend.mapper.VisitedMapper;
import com.vesper.backend.service.VisitedService;
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
public class VisitedServiceImpl implements VisitedService {

    private final VisitedMapper visitedMapper;
    private final BarMapper barMapper;

    @Override
    @Transactional
    public void addVisited(Long barId) {
        Long userId = currentUserId();
        ensureBarExists(barId);

        Long count = visitedMapper.selectCount(new LambdaQueryWrapper<Visited>()
                .eq(Visited::getUserId, userId)
                .eq(Visited::getBarId, barId));
        if (count > 0) {
            return;
        }

        Visited visited = new Visited();
        visited.setUserId(userId);
        visited.setBarId(barId);
        visitedMapper.insert(visited);
    }

    @Override
    @Transactional
    public void removeVisited(Long barId) {
        Long userId = currentUserId();

        visitedMapper.delete(new LambdaQueryWrapper<Visited>()
                .eq(Visited::getUserId, userId)
                .eq(Visited::getBarId, barId));
    }

    @Override
    public List<BarVO> listVisited() {
        Long userId = currentUserId();
        List<Long> barIds = visitedMapper.selectList(new LambdaQueryWrapper<Visited>()
                        .eq(Visited::getUserId, userId)
                        .orderByDesc(Visited::getCreatedAt))
                .stream()
                .map(Visited::getBarId)
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
