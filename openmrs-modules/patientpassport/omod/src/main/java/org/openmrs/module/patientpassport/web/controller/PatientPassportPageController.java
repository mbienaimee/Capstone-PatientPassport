package org.openmrs.module.patientpassport.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class PatientPassportPageController {

    @RequestMapping("/module/patientpassport/patientPassport.page")
    public void showPatientPassport(ModelMap model) {
        // Pass the deployed MERN app link
        model.addAttribute("passportUrl", "https://jade-pothos-e432d0.netlify.app/");
    }
}
