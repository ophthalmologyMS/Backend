const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
require("dotenv").config();
const { verifyToken } = require("../../utils/tokens");
const Doctor = require("../../models/doctorModel");
const Patient = require("../../models/patientModel");
const Appointment = require("../../models/appointmentModel");

async function createAppointment(req, res) {
  try {
    // Validate input data
    const { patientName, doctorName, date, time,Service } = req.body;
    if (!patientName || !doctorName || !date ) {
      return res.status(400).json({
        success: false,
        message: "Patient name, doctor name and date are required",
      });
    }

    // Find patient and doctor
    const patient = await Patient.findOne({ username: patientName });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const doctor = await Doctor.findOne({ username: doctorName });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // const doctorAvailableDays = doctor.availableDays;
    // const doctorAvailableTime = doctor.availableTime;

    // if (!doctorAvailableDays.includes(date.getDay())) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Doctor is not available on the specified date",
    //   });
    // }

    // if (doctorAvailableTime !== time) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Doctor is not available at the specified time",
    //   });
    // }

    // Check if appointment has been done before
    const previousAppointment = await Appointment.findOne({
      doctor: doctor._id,
      patient: patient._id,
      date,
      
      isDone: true,
    });

    if (previousAppointment) {
      return res.status(400).json({
        success: false,
        message: "Appointment has already been completed",
      });
    }

    const appointment = {
      doctor: {
        _id: doctor._id,
        name: doctor.username,
      },
      patient: {
        _id: patient._id,
        name: patient.username,
      },
      date,
      time,
      Service,
      isDone: false,
    };

    doctor.appointments.push(appointment);
    patient.appointments.push(appointment);
    await doctor.save();
    await patient.save();
    // Create appointment instance
    const appointment1 = new Appointment({
      doctor: doctor._id,
      patient: patient._id,
      doctorName: doctor.username,
      patientName: patient.username,
      date,
      Service,
      time,
      isDone: false,
    });

    await appointment1.save();

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getAllAppointments(req, res) {
  try {
    const { type } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required in the request body.",
      });
    }

    let filter = {};
    let userModel;
    switch (type) {
      case "patient":
        filter.patientName = username;
        userModel = Patient;
        break;
      case "doctor":
        filter.doctorName = username;
        userModel = Doctor;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type. Type must be 'patient' or 'doctor'.",
        });
    }

    const user = await userModel.findOne({ username: username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    const appointments = await Appointment.find(filter);

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getAvailableTimeSlots(req, res) {
  try {
    const doctors = await Doctor.find();
    const availableTimeSlots = doctors
      .map((doctor) => {
        return {
          doctorName: doctor.username,
          timeSlots: doctor.availableDays,
        };
      })
      .flat();

    return res.status(200).json({
      success: true,
      availableTimeSlots,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
async function editAppointment(req, res) {
  try {
    const { appointmentId, patientName, doctorName, newDate, newTime } =
      req.body;
    if (!appointmentId || !doctorName) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID, patientName, and doctorName are required",
      });
    }
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const doctor = await Doctor.findOne({ username: doctorName });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    // const doctorAvailableDays = doctor.availableDays.map((day) =>
    //   day.toLowerCase()
    // );
    // const newDateDay = new Date(newDate)
    //   .toLocaleDateString("en-US", { weekday: "long" })
    //   .toLowerCase();

    // if (!doctorAvailableDays.includes(newDateDay)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Doctor is not available on the specified date",
    //   });
    // }

    if (newDate) {
      appointment.date = newDate;
    }
    if (newTime) {
      appointment.time = newTime;
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
async function markDone(req, res) {
  try{
const{ _id}=req.body
const appointment = await Appointment.findById(_id);

if (!appointment) {
  return res.status(400).json({
    success: false,
    message: "Appointment not found",
  });
}

// Update an attribute in the appointment
appointment.isDone = true;
await appointment.save();

return res.status(200).json({
  success: true,
  message: "Appointment attribute updated successfully",
  appointment,
});


  }
  catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function cancelAppointment(req, res) {
  try {
    const  appointmentId  = req.params.id;

    const appointment = await Appointment.findByIdAndDelete(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function getAllAppointments(req, res) {
  try {
    const appointments = await Appointment.find();
    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
  createAppointment,
  getAllAppointments,
  getAvailableTimeSlots,
  editAppointment,
  markDone,
  cancelAppointment,
  getAllAppointments,

};
