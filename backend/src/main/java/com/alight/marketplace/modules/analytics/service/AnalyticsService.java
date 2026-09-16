package com.alight.marketplace.modules.analytics.service;

import com.alight.marketplace.modules.analytics.dto.AdminAnalyticsOverviewDTO;
import com.alight.marketplace.modules.analytics.dto.VendorAnalyticsOverviewDTO;

import java.util.UUID;

public interface AnalyticsService {

    AdminAnalyticsOverviewDTO getAdminAnalyticsOverview();

    VendorAnalyticsOverviewDTO getVendorAnalyticsOverview(UUID vendorId);
}
