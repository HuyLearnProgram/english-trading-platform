<h1 align="center">Booking System</h1>

Welcome to the Booking System! This project is designed to facilitate easy and efficient booking management for various types of businesses, with a focus on local businesses, using a robust and scalable technology stack. It includes comprehensive features for user authentication, business and booking management, payment integration, and more.

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Deployment](#deployment)

## Features

1. **User Registration and Authentication**
    - Implement a user registration and login system using JWT (JSON Web Token).
  
2. **User Roles**
    - Define different roles such as Admin, Business Owner, and Customer.
    - Each role has access to their respective dashboard:
        - Business Owners have access to their own business dashboard.
        - Customers have access to their own customer dashboard.
        - Admins have access to their own admin dashboard.

3. **Business Management**
    - Allow business owners to register their businesses.
    - Enable business profile management including business hours, services offered, and pricing.
    - Provide business owners the ability to track customer bookings, including date, day, time, status, and payment status.
    - Allow business owners to view and reply to customer reviews.

4. **Booking Management**
    - Enable customers to view available businesses and book services.
    - Provide booking confirmation and cancellation features.
    - Include a calendar view and available hours for customers to manage bookings.

5. **Payment Integration**
    - Integrate [Stripe](https://stripe.com/) for customers to make payments.

6. **Reviews and Ratings**
    - Allow customers to leave reviews and ratings for businesses.

7. **Admin Dashboard**
    - Monitor all registered businesses, display user accounts, and track bookings.
    - Generate reports and analytics.

## Tech Stack

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

[![Render](https://img.shields.io/badge/Render-0468D7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- [PostgreSQL](https://www.postgresql.org/) installed
- A [Stripe](https://stripe.com/) account for payment integration

### Backend Setup

1. Clone the repository:
    ```sh
    git clone https://github.com/chrispsang/Booking-System.git
    cd Booking-System/booking-system-backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up the environment variables in a `.env` file:
    ```plaintext
    STRIPE_SECRET_KEY=
    DATABASE_HOST=
    DATABASE_PORT=
    DATABASE_USERNAME=
    DATABASE_PASSWORD=
    DATABASE_NAME=
    ```

4. Run the backend server (default port 3000):
    ```sh
    npm run start
    ```

### Frontend Setup

1. Navigate to the frontend directory:
    ```sh
    cd ../booking-system-frontend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up the environment variables:
    - For development: Create a `.env.development` file with the following content:
      ```plaintext
      REACT_APP_API_URL=http://localhost:3000
      REACT_APP_STRIPE_PUBLIC_KEY=
      ```
      
4. Run the frontend server (default port 3001):
    ```sh
    npm start
    ```

You can access the frontend at [http://localhost:3001](http://localhost:3001) for development and [https://booking-system-muqm.onrender.com](https://booking-system-muqm.onrender.com) for production. The backend can be accessed at [http://localhost:3000](http://localhost:3000) for development and [https://booking-system-backend-i7qd.onrender.com](https://booking-system-backend-i7qd.onrender.com) for production.

### Testing with Stripe Payment

To test payments with Stripe, use the following test card details:

- **Card Number**: 4242 4242 4242 4242
- **Expiry Date**: Any future date
- **CVC**: Any 3 digits
- **ZIP Code**: Any 5 digits

## Deployment

### Render Deployment Links

- Frontend: [https://booking-system-muqm.onrender.com](https://booking-system-muqm.onrender.com)
- Backend: [https://booking-system-backend-i7qd.onrender.com](https://booking-system-backend-i7qd.onrender.com)

---
