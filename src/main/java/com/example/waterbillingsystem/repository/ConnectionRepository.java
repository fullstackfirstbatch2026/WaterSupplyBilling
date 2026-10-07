package com.example.waterbillingsystem.repository;

import com.example.waterbillingsystem.entity.Connection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConnectionRepository extends JpaRepository<Connection, Integer> {

    List<Connection> findByConsumerConsumerId(Integer consumerId);
}