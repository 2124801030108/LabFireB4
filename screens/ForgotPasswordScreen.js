import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { RecaptchaVerifier, signInWithPhoneNumber, sendPasswordResetEmail } from "firebase/auth";

import { Colors, auth } from "../config";
import { View, TextInput, Button, FormErrorMessage } from "../components";

const passwordResetSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").when('method', {
    is: 'email',
    then: Yup.string().required("Email is required"),
  }),
  phoneNumber: Yup.string().when('method', {
    is: 'phone',
    then: Yup.string()
      .required("Phone number is required")
      .matches(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  }),
});

export const ForgotPasswordScreen = ({ navigation }) => {
  const [errorState, setErrorState] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [method, setMethod] = useState('email'); // State to toggle between email and phone

  const handleSendOTP = async (values) => {
    const { phoneNumber } = values;

    const appVerifier = new RecaptchaVerifier('recaptcha-container', {}, auth);
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      .then((confirmationResult) => {
        setVerificationId(confirmationResult.verificationId);
        console.log("OTP sent to phone number.");
        navigation.navigate("VerifyOTP", { verificationId }); // Navigate to OTP verification screen
      })
      .catch((error) => setErrorState(error.message));
  };

  const handleSendEmail = async (values) => {
    const { email } = values;

    sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log("Password Reset Email sent.");
        navigation.navigate("Login");
      })
      .catch((error) => setErrorState(error.message));
  };

  const handleSubmit = async (values) => {
    if (method === 'phone') {
      await handleSendOTP(values);
    } else {
      await handleSendEmail(values);
    }
  };

  return (
    <View isSafe style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.screenTitle}>Reset your password</Text>
        <Button
          title={`Use ${method === 'email' ? 'Phone Number' : 'Email'}`}
          onPress={() => setMethod(method === 'email' ? 'phone' : 'email')}
        />
      </View>
      <Formik
        initialValues={{ email: "", phoneNumber: "" }}
        validationSchema={passwordResetSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          touched,
          errors,
          handleChange,
          handleSubmit,
          handleBlur,
        }) => (
          <>
            {method === 'email' ? (
              <TextInput
                name="email"
                leftIconName="email"
                placeholder="Enter email"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={values.email}
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
              />
            ) : (
              <TextInput
                name="phoneNumber"
                leftIconName="phone"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={values.phoneNumber}
                onChangeText={handleChange("phoneNumber")}
                onBlur={handleBlur("phoneNumber")}
              />
            )}
            <FormErrorMessage error={errors[method]} visible={touched[method]} />
            {errorState !== "" && (
              <FormErrorMessage error={errorState} visible={true} />
            )}
            <Button style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Send {method === 'email' ? 'Reset Email' : 'OTP'}</Text>
            </Button>
          </>
        )}
      </Formik>
      <Button
        style={styles.borderlessButtonContainer}
        borderless
        title={"Go back to Login"}
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
  },
  innerContainer: {
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.black,
    paddingTop: 20,
  },
  button: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: Colors.orange,
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: "700",
  },
  borderlessButtonContainer: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
