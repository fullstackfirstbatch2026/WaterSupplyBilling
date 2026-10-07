package com.example.waterbillingsystem.repository;

import com.example.waterbillingsystem.entity.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface ReadingRepository extends JpaRepository<Reading, Integer> {

    List<Reading> findByConnectionConnectionId(Integer connectionId);

    // Cascade delete: remove all readings for a connection
    void deleteByConnectionConnectionId(Integer connectionId);


    // ============================================================
    // 1. WATER USAGE TREND
    // ============================================================

    @Query(value = """
        SELECT
            r.connection_id AS connectionId,
            r.reading_date AS readingDate,
            (r.current_reading - r.previous_reading) AS consumption
        FROM readings r
        WHERE r.connection_id = :connectionId
        ORDER BY r.reading_date
        """, nativeQuery = true)
    List<Map<String, Object>> getUsageTrend(
            @Param("connectionId") Integer connectionId
    );


    // ============================================================
    // 2. NEXT BILL PREDICTION
    // ============================================================

    @Query(value = """
        SELECT
            r.connection_id AS connectionId,
            ROUND(
                AVG(r.current_reading - r.previous_reading)
            ) AS predictedUnits,

            calculate_water_charge(
                ROUND(
                    AVG(r.current_reading - r.previous_reading)
                )
            ) AS predictedBill

        FROM readings r
        WHERE r.connection_id = :connectionId
        GROUP BY r.connection_id
        """, nativeQuery = true)
    Map<String, Object> getBillPrediction(
            @Param("connectionId") Integer connectionId
    );


    // ============================================================
    // 3. USAGE INCREASE / DECREASE
    // ============================================================

    @Query(value = """
        SELECT
            r.connection_id AS connectionId,
            r.reading_date AS readingDate,

            (r.current_reading - r.previous_reading)
                AS consumption,

            (
                (r.current_reading - r.previous_reading)
                -
                LAG(
                    r.current_reading - r.previous_reading
                ) OVER (
                    PARTITION BY r.connection_id
                    ORDER BY r.reading_date
                )
            ) AS consumptionChange

        FROM readings r

        WHERE r.connection_id = :connectionId

        ORDER BY r.reading_date
        """, nativeQuery = true)
    List<Map<String, Object>> getUsageInsight(
            @Param("connectionId") Integer connectionId
    );
}