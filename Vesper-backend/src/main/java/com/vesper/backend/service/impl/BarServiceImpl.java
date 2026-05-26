package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.entity.Bar;
import com.vesper.backend.entity.Review;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.BarMapper;
import com.vesper.backend.mapper.ReviewMapper;
import com.vesper.backend.service.BarService;
import com.vesper.backend.vo.BarVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BarServiceImpl implements BarService {

    private final BarMapper barMapper;
    private final ReviewMapper reviewMapper;

    @Override
    public List<BarVO> listBars(String city, String keyword) {
        LambdaQueryWrapper<Bar> queryWrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(city)) {
            queryWrapper.eq(Bar::getCity, city.trim());
        }

        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            queryWrapper.and(wrapper -> wrapper
                    .like(Bar::getName, value)
                    .or()
                    .like(Bar::getCategory, value)
                    .or()
                    .like(Bar::getAddress, value));
        }

        queryWrapper.orderByDesc(Bar::getCreatedAt);

        return barMapper.selectList(queryWrapper)
                .stream()
                .map(this::toBarVO)
                .toList();
    }

    @Override
    public BarVO getBarById(Long id) {
        Bar bar = barMapper.selectById(id);
        if (bar == null) {
            throw new BusinessException(404, "Bar not found");
        }
        return toBarVO(bar);
    }

    private BarVO toBarVO(Bar bar) {
        BarVO vo = BarVO.from(bar);
        List<Review> reviews = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getBarId, bar.getId()));
        vo.setReviewCount(reviews.size());

        if (!reviews.isEmpty()) {
            BigDecimal total = reviews.stream()
                    .map(review -> BigDecimal.valueOf(review.getRating()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            vo.setAverageRating(total.divide(BigDecimal.valueOf(reviews.size()), 1, RoundingMode.HALF_UP));
        }

        return vo;
    }
}
