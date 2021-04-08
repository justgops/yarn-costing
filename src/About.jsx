import { Link, Typography } from '@material-ui/core';
import React from 'react';

export default function About() {
  return (
  <>
  <Typography>
    Attendance and Payroll management is one of our milestone project.
    We've done research and worked hard to make this software easy to use.
  </Typography>
  <Typography>
    <Typography>Contact:</Typography>
    <Typography>Aditya Toshniwal - <Link href = "mailto: aditya.toshniwal14@gmail.com">aditya.toshniwal14@gmail.com</Link></Typography>
    <Typography>Shreegopal Totala - <Link href = "mailto: rajatotala@gmail.com">rajatotala@gmail.com</Link></Typography>
  </Typography>
  </>
  );
}