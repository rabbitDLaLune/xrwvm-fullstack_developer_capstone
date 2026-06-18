
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "./Dealers.css";
import "../assets/style.css";

import positiveIcon from "../assets/positive.png";
import neutralIcon from "../assets/neutral.png";
import negativeIcon from "../assets/negative.png";
import reviewIcon from "../assets/reviewbutton.png";
import Header from "../Header/Header";

const Dealer = () => {
  const { id } = useParams();

  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingDealer, setLoadingDealer] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState("");

  const dealerUrl = `/djangoapp/dealer/${id}`;
  const reviewsUrl = `/djangoapp/reviews/dealer/${id}`;
  const postReviewUrl = `/postreview/${id}`;

  const getDealer = async () => {
    try {
      const response = await fetch(dealerUrl);

      if (!response.ok) {
        throw new Error(`Dealer request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 200 && result.dealer) {
        // The API returns one dealer object, not an array.
        setDealer(result.dealer);
      } else {
        throw new Error("Dealer information was not found.");
      }
    } catch (err) {
      console.error("Failed to load dealer:", err);
      setError("Unable to load dealer information.");
    } finally {
      setLoadingDealer(false);
    }
  };

  const getReviews = async () => {
    try {
      const response = await fetch(reviewsUrl);

      if (!response.ok) {
        throw new Error(`Reviews request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 200) {
        setReviews(Array.isArray(result.reviews) ? result.reviews : []);
      } else {
        throw new Error("Reviews could not be loaded.");
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Unable to load dealer reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === "positive") {
      return positiveIcon;
    }

    if (sentiment === "negative") {
      return negativeIcon;
    }

    return neutralIcon;
  };

  useEffect(() => {
    getDealer();
    getReviews();
  }, [id]);

  if (loadingDealer) {
    return (
      <div style={{ margin: "20px" }}>
        <Header />
        <p>Loading dealer information...</p>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div style={{ margin: "20px" }}>
        <Header />
        <p>{error || "Dealer not found."}</p>
      </div>
    );
  }

  return (
    <div style={{ margin: "20px" }}>
      <Header />

      <div style={{ marginTop: "10px" }}>
        <h1 style={{ color: "grey" }}>
          {dealer.full_name}

          {sessionStorage.getItem("username") && (
            <a href={postReviewUrl}>
              <img
                src={reviewIcon}
                style={{
                  width: "10%",
                  marginLeft: "10px",
                  marginTop: "10px",
                }}
                alt="Post Review"
              />
            </a>
          )}
        </h1>

        <h4 style={{ color: "grey" }}>
          {dealer.city}, {dealer.address}, Zip - {dealer.zip}, {dealer.state}
        </h4>
      </div>

      <div className="reviews_panel">
        {loadingReviews ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div>No reviews yet!</div>
        ) : (
          reviews.map((review, index) => (
            <div
              className="review_panel"
              key={review._id || `${review.dealership}-${index}`}
            >
              <img
                src={getSentimentIcon(review.sentiment)}
                className="emotion_icon"
                alt={`${review.sentiment || "neutral"} sentiment`}
              />

              <div className="review">
                {review.review}
              </div>

              <div className="reviewer">
                {review.name} {review.car_make} {review.car_model}{" "}
                {review.car_year}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dealer;
