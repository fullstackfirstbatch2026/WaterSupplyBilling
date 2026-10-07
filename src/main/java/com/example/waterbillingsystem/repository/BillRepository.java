package com.example.waterbillingsystem.repository;

import com.example.waterbillingsystem.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Integer> {

    // Cascade delete: remove all bills for a consumer
    void deleteByConsumerConsumerId(Integer consumerId);

    // JOIN bill with consumer details
    @Query(value = """
        SELECT b.*
        FROM bills b
        JOIN consumers c
            ON b.consumer_id = c.consumer_id
        """, nativeQuery = true)
    List<Bill> findBillsWithConsumerDetails();

    //JOIN bills+connection+consumer+readings
    @Query(value = """
        SELECT b.*
        FROM bills b
        JOIN consumers c
            ON b.consumer_id = c.consumer_id
        JOIN readings r
            ON b.reading_id = r.reading_id
        JOIN connections con
            ON r.connection_id = con.connection_id
        """, nativeQuery = true)
    List<Bill> findCompleteBillDetails();

    // Find bills by billing status
    List<Bill> findByBillingStatus(String billingStatus);

    // Find bills belonging to a consumer
    List<Bill> findByConsumerConsumerId(Integer consumerId);
}