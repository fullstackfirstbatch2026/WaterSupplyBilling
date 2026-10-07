package com.example.waterbillingsystem.controller;

import com.example.waterbillingsystem.entity.Reading;
import com.example.waterbillingsystem.repository.ReadingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/readings")
public class ReadingController {

    private final ReadingRepository readingRepository;

    public ReadingController(ReadingRepository readingRepository) {
        this.readingRepository = readingRepository;
    }


    // ============================================================
    // EXISTING APIs
    // ============================================================

    // GET all readings
    @GetMapping
    public List<Reading> getAllReadings() {
        return readingRepository.findAll();
    }


    // GET reading by ID
    @GetMapping("/{id}")
    public Reading getReadingById(@PathVariable Integer id) {
        return readingRepository.findById(id).orElse(null);
    }


    // GET readings for a connection
    @GetMapping("/connection/{connectionId}")
    public List<Reading> getReadingsByConnection(
            @PathVariable Integer connectionId) {

        return readingRepository
                .findByConnectionConnectionId(connectionId);
    }


    // ============================================================
    // NEW: WATER USAGE TREND
    // ============================================================

    @GetMapping("/connection/{connectionId}/usage-trend")
    public List<Map<String, Object>> getUsageTrend(
            @PathVariable Integer connectionId) {

        return readingRepository.getUsageTrend(connectionId);
    }


    // ============================================================
    // NEW: NEXT BILL PREDICTION
    // ============================================================

    @GetMapping("/connection/{connectionId}/bill-prediction")
    public ResponseEntity<?> getBillPrediction(
            @PathVariable Integer connectionId) {

        Map<String, Object> result =
                readingRepository.getBillPrediction(connectionId);

        if (result == null || result.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }


    // ============================================================
    // NEW: USAGE INSIGHT
    // ============================================================

    @GetMapping("/connection/{connectionId}/usage-insight")
    public List<Map<String, Object>> getUsageInsight(
            @PathVariable Integer connectionId) {

        return readingRepository.getUsageInsight(connectionId);
    }


    // ============================================================
    // EXISTING POST
    // ============================================================

    @PostMapping
    public Reading addReading(@RequestBody Reading reading) {
        return readingRepository.save(reading);
    }


    // ============================================================
    // EXISTING DELETE
    // ============================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReading(
            @PathVariable Integer id) {

        readingRepository.deleteById(id);

        return ResponseEntity.ok(
                Map.of("message", "Reading deleted successfully")
        );
    }
}