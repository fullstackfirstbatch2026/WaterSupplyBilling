package com.example.waterbillingsystem.repository;

import com.example.waterbillingsystem.entity.Consumer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ConsumerRepository extends JpaRepository<Consumer, Integer> {

    // Consumers whose consumption is above average
    @Query("""
        SELECT c
        FROM Consumer c
        JOIN Bill b ON c.consumerId = b.consumer.consumerId
        WHERE b.consumption > (
            SELECT AVG(b2.consumption)
            FROM Bill b2
        )
    """)
    List<Consumer> findConsumersAboveAverageConsumption();
}