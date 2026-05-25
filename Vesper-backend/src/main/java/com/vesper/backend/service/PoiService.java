package com.vesper.backend.service;

import com.vesper.backend.dto.ImportPoiRequest;
import com.vesper.backend.vo.BarVO;
import com.vesper.backend.vo.PoiVO;

import java.math.BigDecimal;
import java.util.List;

public interface PoiService {

    List<PoiVO> listNearbyBars(BigDecimal latitude, BigDecimal longitude);

    BarVO importPoi(ImportPoiRequest request);
}
