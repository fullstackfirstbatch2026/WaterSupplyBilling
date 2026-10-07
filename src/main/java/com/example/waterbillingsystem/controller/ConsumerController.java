package com.example.waterbillingsystem.controller;

import com.example.waterbillingsystem.entity.Connection;
import com.example.waterbillingsystem.entity.Consumer;
import com.example.waterbillingsystem.repository.BillRepository;
import com.example.waterbillingsystem.repository.ConnectionRepository;
import com.example.waterbillingsystem.repository.ConsumerRepository;
import com.example.waterbillingsystem.repository.ReadingRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consumers")
public class ConsumerController {

    private final ConsumerRepository consumerRepository;
    private final ConnectionRepository connectionRepository;
    private final ReadingRepository readingRepository;
    private final BillRepository billRepository;

    public ConsumerController(
            ConsumerRepository consumerRepository,
            ConnectionRepository connectionRepository,
            ReadingRepository readingRepository,
            BillRepository billRepository) {
        this.consumerRepository = consumerRepository;
        this.connectionRepository = connectionRepository;
        this.readingRepository = readingRepository;
        this.billRepository = billRepository;
    }

    // GET all consumers
    @GetMapping
    public List<Consumer> getAllConsumers() {
        return consumerRepository.findAll();
    }

    // GET consumer by ID
    @GetMapping("/{id}")
    public Consumer getConsumerById(@PathVariable Integer id) {
        return consumerRepository.findById(id).orElse(null);
    }

    // POST new consumer
    @PostMapping
    public Consumer addConsumer(@RequestBody Consumer consumer) {
        return consumerRepository.save(consumer);
    }

    // PUT update consumer
    @PutMapping("/{id}")
    public Consumer updateConsumer(
            @PathVariable Integer id,
            @RequestBody Consumer consumer) {

        Consumer existing = consumerRepository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setName(consumer.getName());
        existing.setAddress(consumer.getAddress());
        existing.setPhone(consumer.getPhone());

        return consumerRepository.save(existing);
    }

    // DELETE consumer (simple — fails if FK children exist)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteConsumer(@PathVariable Integer id) {
        consumerRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Consumer deleted successfully"));
    }

    // CASCADE DELETE: bills → readings → connections → consumer
    @Transactional
    @DeleteMapping("/{id}/cascade")
    public ResponseEntity<Map<String, String>> deleteConsumerCascade(@PathVariable Integer id) {
        // Step 1: Delete all bills belonging to this consumer
        billRepository.deleteByConsumerConsumerId(id);

        // Step 2: Get all connections for this consumer
        List<Connection> connections = connectionRepository.findByConsumerConsumerId(id);

        // Step 3: Delete readings for each connection
        for (Connection conn : connections) {
            readingRepository.deleteByConnectionConnectionId(conn.getConnectionId());
        }

        // Step 4: Delete all connections for this consumer
        connectionRepository.deleteAll(connections);

        // Step 5: Delete the consumer itself
        consumerRepository.deleteById(id);

        return ResponseEntity.ok(Map.of("message", "Consumer and all associated records deleted successfully"));
    }

    // SUBQUERY
    // Consumers whose consumption is above average
    @GetMapping("/above-average")
    public List<Consumer> getAboveAverageConsumers() {
        return consumerRepository.findConsumersAboveAverageConsumption();
    }
}