import { LiaTableTennisSolid } from "react-icons/lia";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const About = ({
  aboutHeading,
  aboutDescription,
  feature1Heading,
  feature1Description,
  feature2Heading,
  feature2Description,
  coachingHeading,
  coachingDescription,
  groupCoachingHeading,
  groupCoachingDescription,
  price,
  timing1Heading,
  timing1Description,
  timing2Heading,
  timing2Description,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <div id="about" className="py-20">
      <div className="flex max-[750px]:flex-col bg-gray-50 rounded-xl p-5 gap-5">
        <div className="flex-1 flex flex-col gap-4">
          <p className="font-riope text-[35px] leading-9 text-black/90">
            {aboutHeading}
          </p>
          <p className="font-in">{aboutDescription}</p>
          <button
            onClick={handleOpenDialog}
            className="flex px-4 py-2 text-sm tracking-wide font-semibold w-[150px]
              text-orange-500
              border
              border-orange-500
              hover:shadow-xl
              active:shadow-md
              rounded-lg
              transition-all
              duration-300
              ease-out
              transform
              gap-2 justify-center
              hover:bg-orange-500
              hover:text-white
              active:scale-95
              overflow-hidden"
          >
            Read More <LiaTableTennisSolid className="text-[20px]" />
          </button>
        </div>
        <div className="flex-1 flex gap-2">
          <div className="flex-1 rounded-lg max-[750px]:h-[400px] bg-img1 bg-cover bg-center bg-no-repeat"></div>
          <div className="flex-1 flex gap-2 flex-col">
            <div className="rounded-lg flex-1 bg-img2 bg-cover bg-center bg-no-repeat"></div>
            <div className="rounded-lg flex-1 bg-img3 bg-cover bg-center bg-no-repeat"></div>
          </div>
        </div>
      </div>

      {/* Dialog Box */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "16px",
            padding: "8px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px 8px 24px",
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #e9ecef",
          }}
        >
          <span className="font-riope text-2xl text-orange-600">
            BT's TT Academy Details
          </span>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: "#6c757d",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.04)",
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ padding: "24px" }}>
          <div className="font-in gap-4 flex flex-col">
            <div className="mb-4">
              <div className="font-riope text-xl mb-3 text-gray-800">
                BT's TT Academy
              </div>
              <p className="mb-4 text-gray-700">
                🧠 My warm-up and cool-down exercises are uniquely designed
                using techniques learned from:
              </p>
              <div className="space-y-2 ml-4">
                <p className="text-gray-600">
                  • NCC Army Wing Senior Under Officer ("C" Certificate Holder)
                </p>
                <p className="text-gray-600">
                  • Multi-sport experience including Kho-Kho, Kabaddi, Handball,
                  and Table Tennis
                </p>
                <p className="text-gray-600">
                  • Chinese Kung Fu (Blue Belt Holder from "Shaolin Jackie Chan
                  Martial Arts Academy")
                </p>
              </div>
              {/* <pre className=" font-in">{feature1Description}</pre> */}
              
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                If you are looking to elevate your TT game, I bring a unique mix
                of corporate experience, sports discipline, and mentoring
                passion to help you reach your goals with confidence.
              </p>
            </div>

            <div className="mb-4">
              <h1 className="text-lg font-semibold text-gray-800 mb-3 underline">
                {feature1Heading}
              </h1>
              <p className="mb-3 text-gray-700">
                {feature1Description}
              </p>
              </div>

            <div className="mb-4">
              <h1 className="text-lg font-semibold text-gray-800 mb-3 underline">
                {feature2Heading}
              </h1>
              <p className="mb-3 text-gray-700">
                {feature2Description}
              </p>
              <p className="mb-3 text-gray-700">
                <strong>{coachingHeading}</strong> {coachingDescription}
              </p>
              <p className="mb-3 text-gray-700">
                <strong>
                  {groupCoachingHeading}
                </strong>
               {groupCoachingDescription}
              </p>
            </div>

            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-800 text-sm">
               {price}
              </p>
            </div>

            <div className="mb-2">
              <p className="font-semibold text-gray-800 mb-2">
                My TT Coaching Timings:
              </p>
              <div className="space-y-1 ml-4">
                <p className="text-gray-700">
                  <strong>{timing1Heading}</strong>{timing1Description}
                </p>
                <p className="text-gray-700">
                  <strong>{timing2Heading}</strong>{timing2Description}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm font-medium">
                📞 For bookings and inquiries, please contact us via the contact
                form or email to btsttacademy@gmail.com.
              </p>
            </div>
          </div>
        </DialogContent>

        <DialogActions
          sx={{ padding: "16px 24px", borderTop: "1px solid #e9ecef" }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              backgroundColor: "#f97316",
              "&:hover": {
                backgroundColor: "#ea580c",
              },
              textTransform: "none",
              fontWeight: "600",
              padding: "8px 24px",
              borderRadius: "8px",
            }}
            autoFocus
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default About;
