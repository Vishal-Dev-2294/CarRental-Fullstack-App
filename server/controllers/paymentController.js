import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    if (!amount || !bookingId) {
      return res.json({ success: false, message: "Invalid data" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
    };

    const order = await razorpay.orders.create(options);

    await Booking.findByIdAndUpdate(bookingId, {
      orderId: order.id,
    });

    res.json({ success: true, order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ VERIFY PAYMENT (SECURE 🔥)
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ Payment verified

      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "paid",
        status: "confirmed",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });

      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Verification Failed" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
