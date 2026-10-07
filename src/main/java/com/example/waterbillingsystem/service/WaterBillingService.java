package com.example.waterbillingsystem.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class WaterBillingService {

    private final JdbcTemplate jdbcTemplate;

    public WaterBillingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Double calculateWaterCharge(int units) {
        String sql = "SELECT calculate_water_charge(?)";
        return jdbcTemplate.queryForObject(sql, Double.class, units);
    }

    public String generateWaterBill(int readingId) {
        try {
            String sql = "CALL generate_water_bill(?)";
            jdbcTemplate.update(sql, readingId);

            return "Water bill generated successfully";

        } catch (Exception e) {

            if (e.getMessage().contains("Bill already exists for this reading")) {
                return "Bill already exists for this reading";
            }

            throw e;
        }
    }
}