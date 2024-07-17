import { useContext, useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext.jsx";

export default function BookingWidget({ place }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [redirect, setRedirect] = useState('');
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  let numberOfNights = 0;
  if (checkIn && checkOut) {
    numberOfNights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  }

  async function handlePayment(order) {
    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: "INR",
      name: order.product_name,
      description: order.description,
      image: "https://dummyimage.com/600x400/000/fff",
      order_id: order.order_id,
      handler: function (response) {
        alert("Payment Successful");
        bookThisPlace(response);
      },
      prefill: {
        contact: user.phone,
        name: user.name,
        email: user.email
      },
      theme: {
        color: "#2300a3"
      }
    };
    const razorpayObject = new window.Razorpay(options);
    razorpayObject.open();
  }

  async function bookThisPlace(response) {
    const bookingResponse = await axios.post('/bookings', {
      checkIn, checkOut, numberOfGuests, name, phone,
      place: place._id,
      price: numberOfNights * place.price,
      paymentId: response.razorpay_payment_id
    });
    const bookingId = bookingResponse.data._id;
    setRedirect(`/account/bookings/${bookingId}`);
  }

  async function initiateBooking() {
    try {
        console.log("Initiating booking...");
        const orderResponse = await axios.post('/createOrder', {
            amount: numberOfNights * place.price,
            name: "Booking at " + place.title,
            description: "Booking for " + numberOfNights + " nights"
        });

        console.log("Order response:", orderResponse.data);

        if (orderResponse.data.success) {
            handlePayment(orderResponse.data);
        } else {
            alert("Order creation failed");
        }
    } catch (error) {
        console.error("Error initiating booking:", error);
        alert("An error occurred while creating the order.");
    }
}

  if (redirect) {
    return <Navigate to={redirect} />
  }

  return (
    <div className="bg-white shadow p-4 rounded-2xl">
      <div className="text-2xl text-center">
        Price: ${place.price} / per night
      </div>
      <div className="border rounded-2xl mt-4">
        <div className="flex">
          <div className="py-3 px-4">
            <label>Check in:</label>
            <input type="date"
                   value={checkIn}
                   onChange={ev => setCheckIn(ev.target.value)} />
          </div>
          <div className="py-3 px-4 border-l">
            <label>Check out:</label>
            <input type="date" value={checkOut}
                   onChange={ev => setCheckOut(ev.target.value)} />
          </div>
        </div>
        <div className="py-3 px-4 border-t">
          <label>Number of guests:</label>
          <input type="number"
                 value={numberOfGuests}
                 onChange={ev => setNumberOfGuests(ev.target.value)} />
        </div>
        {numberOfNights > 0 && (
          <div className="py-3 px-4 border-t">
            <label>Your full name:</label>
            <input type="text"
                   value={name}
                   onChange={ev => setName(ev.target.value)} />
            <label>Phone number:</label>
            <input type="tel"
                   value={phone}
                   onChange={ev => setPhone(ev.target.value)} />
          </div>
        )}
      </div>
      <button onClick={initiateBooking} className="primary mt-4">
        Book this place
        {numberOfNights > 0 && (
          <span> ${numberOfNights * place.price}</span>
        )}
      </button>
    </div>
  );
}
