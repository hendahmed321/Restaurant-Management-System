import os

class Config:
    SECRET_KEY = 'restaurant-secret-key-2024'  # Keep this for JWT
    SQLALCHEMY_DATABASE_URI = 'mssql+pyodbc://@localhost/RestaurantDB?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-restaurant-secret-2024'  # Add this for JWT