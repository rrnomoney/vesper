package com.vesper.backend.service;

import com.vesper.backend.vo.BarVO;

import java.util.List;

public interface VisitedService {

    void addVisited(Long barId);

    void removeVisited(Long barId);

    List<BarVO> listVisited();
}
