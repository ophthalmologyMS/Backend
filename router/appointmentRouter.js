const express = require('express');
const router = express.Router();
const appointmentController = require("../controller/appointment/appointmentsController");

router.get("/appointments", appointmentController.getAvailableTimeSlots);
router.post("/createAppointment", appointmentController.createAppointment);
router.get(
  "/appointments/history/:type/:username",
  appointmentController.getWhoAppointments
);
router.post("/appointments/markDone", appointmentController.markDone);
router.patch("/cancelAppointment/:id", appointmentController.cancelAppointment);
router.post("/appointments/edit", appointmentController.editAppointment);   
router.get("/allAppointments", appointmentController.getAllAppointments);        

module.exports = router;
