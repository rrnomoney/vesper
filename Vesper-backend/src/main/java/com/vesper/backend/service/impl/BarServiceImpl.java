package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.entity.Bar;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.BarMapper;
import com.vesper.backend.service.BarService;
import com.vesper.backend.vo.BarVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BarServiceImpl implements BarService {

    private final BarMapper barMapper;

    @Override
    public List<BarVO> listBars() {
        return barMapper.selectList(new LambdaQueryWrapper<Bar>()
                        .orderByDesc(Bar::getCreatedAt))
                .stream()
                .map(BarVO::from)
                .toList();
    }

    @Override
    public BarVO getBarById(Long id) {
        Bar bar = barMapper.selectById(id);
        if (bar == null) {
            throw new BusinessException(404, "Bar not found");
        }
        return BarVO.from(bar);
    }
}
