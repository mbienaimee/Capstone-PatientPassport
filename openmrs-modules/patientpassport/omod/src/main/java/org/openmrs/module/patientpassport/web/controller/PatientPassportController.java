package org.openmrs.module.patientpassport.web.controller;

import org.openmrs.api.context.Context;
import org.openmrs.api.AdministrationService;
import org.openmrs.api.PatientService;
import org.openmrs.Patient;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.Controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Simple controller for Patient Passport module
 * This controller handles requests and returns JSP views
 */
public class PatientPassportController implements Controller {
    
    @Override
    public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String path = request.getRequestURI();
        
        if (path.contains("patientPassport") || path.contains("main")) {
            return new ModelAndView("module/patientpassport/patientPassport");
        } else if (path.contains("admin")) {
            return new ModelAndView("module/patientpassport/admin");
        } else {
            // Default to main page
            return new ModelAndView("module/patientpassport/patientPassport");
        }
    }
}