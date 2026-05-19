package com.vesper.backend.service;

import com.vesper.backend.vo.BarVO;

import java.util.List;

public interface BarService {

    List<BarVO> listBars();

    BarVO getBarById(Long id);
}
