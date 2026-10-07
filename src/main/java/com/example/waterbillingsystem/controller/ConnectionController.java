package com.example.waterbillingsystem.controller;

import com.example.waterbillingsystem.entity.Connection;
import com.example.waterbillingsystem.repository.ConnectionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionRepository connectionRepository;

    public ConnectionController(ConnectionRepository connectionRepository) {
        this.connectionRepository = connectionRepository;
    }

    // GET all connections
    @GetMapping
    public List<Connection> getAllConnections() {
        return connectionRepository.findAll();
    }

    // GET connection by ID
    @GetMapping("/{id}")
    public Connection getConnectionById(@PathVariable Integer id) {
        return connectionRepository.findById(id).orElse(null);
    }

    // GET connections of a particular consumer
    @GetMapping("/consumer/{consumerId}")
    public List<Connection> getConnectionsByConsumer(
            @PathVariable Integer consumerId) {

        return connectionRepository
                .findByConsumerConsumerId(consumerId);
    }

    // POST connection
    @PostMapping
    public Connection addConnection(@RequestBody Connection connection) {
        return connectionRepository.save(connection);
    }

    // DELETE connection
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteConnection(@PathVariable Integer id) {
        connectionRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Connection deleted successfully"));
    }
}