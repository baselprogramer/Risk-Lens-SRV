package com.sdn.blacklist.dto;

public class ImportResult {

    private int totalEntries;
    private int savedRecords;

    public ImportResult(int totalEntries, int savedRecords) {
        this.totalEntries = totalEntries;
        this.savedRecords = savedRecords;
    }

    public int getTotalEntries() {
        return totalEntries;
    }

    public int getSavedRecords() {
        return savedRecords;
    }
}
