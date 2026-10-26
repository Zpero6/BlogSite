package com.zpero.blog.article.infrastructure;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zpero.blog.article.domain.Article;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ArticleMapper extends BaseMapper<Article> {}
