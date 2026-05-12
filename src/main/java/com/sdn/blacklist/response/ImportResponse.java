package com.sdn.blacklist.response;

public class ImportResponse {

    private boolean success;
    private String source;

    // XML level
    private int totalEntries;

    // DB level
    private int savedRecords;

    private String message;

    public ImportResponse(
            boolean success,
            String source,
            int totalEntries,
            int savedRecords,
            String message
    ) {
        this.success = success;
        this.source = source;
        this.totalEntries = totalEntries;
        this.savedRecords = savedRecords;
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getSource() {
        return source;
    }

    public int getTotalEntries() {
        return totalEntries;
    }

    public int getSavedRecords() {
        return savedRecords;
    }

    public String getMessage() {
        return message;
    }
}
