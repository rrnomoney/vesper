package com.vesper.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("visiteds")
public class Visited {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long barId;

    private LocalDateTime createdAt;
}
