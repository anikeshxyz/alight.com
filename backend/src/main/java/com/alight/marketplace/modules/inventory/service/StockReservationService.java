package com.alight.marketplace.modules.inventory.service;

import com.alight.marketplace.modules.inventory.dto.StockReservationRequest;
import com.alight.marketplace.modules.inventory.dto.StockReservationResponse;

import java.util.List;

public interface StockReservationService {

    StockReservationResponse createReservation(StockReservationRequest request, String userEmail);

    void confirmReservation(String reservationToken);

    void cancelReservation(String reservationToken);

    List<StockReservationResponse> getReservationsByToken(String reservationToken);

    int releaseExpiredReservations();
}
