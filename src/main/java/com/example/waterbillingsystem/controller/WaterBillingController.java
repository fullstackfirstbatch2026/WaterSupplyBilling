package com.example.waterbillingsystem.controller;

import com.example.waterbillingsystem.service.WaterBillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/water-billing")
public class WaterBillingController {

    private final WaterBillingService waterBillingService;

    public WaterBillingController(WaterBillingService waterBillingService) {
        this.waterBillingService = waterBillingService;
    }

    // FUNCTION
    @GetMapping("/calculate-charge/{units}")
    public Double calculateCharge(@PathVariable int units) {

        return waterBillingService.calculateWaterCharge(units);
    }

    // PROCEDURE
    @PostMapping("/generate-bill/{readingId}")
    public ResponseEntity<Map<String, String>> generateBill(@PathVariable int readingId) {
        String result = waterBillingService.generateWaterBill(readingId);
        return ResponseEntity.ok(Map.of("message", result != null ? result : "Water bill generated successfully"));
    }
}