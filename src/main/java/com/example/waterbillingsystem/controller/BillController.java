package com.example.waterbillingsystem.controller;

import com.example.waterbillingsystem.entity.Bill;
import com.example.waterbillingsystem.repository.BillRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillRepository billRepository;

    public BillController(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    // GET all bills
    @GetMapping
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    // GET bill by ID
    @GetMapping("/{id}")
    public Bill getBillById(@PathVariable Integer id) {
        return billRepository.findById(id).orElse(null);
    }

    // JOIN bill with consumer
    @GetMapping("/with-consumer")
    public List<Bill> getBillsWithConsumer() {
        return billRepository.findBillsWithConsumerDetails();
    }

    // JOIN consumer + connection + reading + bill
    @GetMapping("/complete-details")
    public List<Bill> getCompleteBillDetails() {
        return billRepository.findCompleteBillDetails();
    }

    // Find bills by status
    @GetMapping("/status/{status}")
    public List<Bill> getBillsByStatus(
            @PathVariable String status) {

        return billRepository.findByBillingStatus(status);
    }

    // Find bills of a particular consumer
    @GetMapping("/consumer/{consumerId}")
    public List<Bill> getBillsByConsumer(
            @PathVariable Integer consumerId) {

        return billRepository.findByConsumerConsumerId(consumerId);
    }

    // POST bill
    @PostMapping
    public Bill addBill(@RequestBody Bill bill) {

        Bill savedBill = billRepository.save(bill);

        billRepository.flush();

        return savedBill;
    }
    // DELETE bill
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBill(@PathVariable Integer id) {
        billRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Bill deleted successfully"));
    }
    @PutMapping("/{id}")
    public Bill updateBill(
            @PathVariable Integer id,
            @RequestBody Bill bill) {

        Bill existing = billRepository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setPaymentDate(bill.getPaymentDate());

        return billRepository.save(existing);
    }
}