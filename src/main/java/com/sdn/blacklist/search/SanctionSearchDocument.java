package com.sdn.blacklist.search;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(indexName = "sanctions_index" , createIndex = false)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanctionSearchDocument {

   

    @Id
    private String id;           

    @Field(type = FieldType.Keyword)
    private String ofacUid; 

    @Field(type = FieldType.Text, analyzer = "standard")
    private String name;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String translatedName;

    @Field(type = FieldType.Keyword)
    private String type;

    @Field(type = FieldType.Keyword)
    private String country;     

    @Field(type = FieldType.Boolean)
    private Boolean active;

    @Field(type = FieldType.Text, analyzer = "standard")
    private List<String> aliases; 

    @Field(type = FieldType.Keyword)
     private String source;

    @Field(type = FieldType.Keyword)
    private String phoneticName;
}
