package com.sdn.blacklist.search;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SearchRepository
        extends ElasticsearchRepository<SanctionSearchDocument, String> {

               
}