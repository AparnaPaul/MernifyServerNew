import { Address } from "../models/addressModel.js";
import tryCatch from "../utils/tryCatch.js";

export const addAddress = tryCatch(async (req, res) => {
    console.log("Decoded user from token:", req.user)
    const { address, phone } = req.body;

    await Address.create({
        address,
        phone,
        user: req.user._id
    })

    res.status(201).json({
        message: "Address created"
    })
})

export const getAllAddress = tryCatch(async (req, res) => {
    const allAddress = await Address.find({ user: req.user.id });
    res.json(allAddress)
})

export const getSingleAddress = tryCatch(async (req, res) => {
    const address = await Address.findById(req.params.id);

    res.json(address);
})


export const deleteAddress = tryCatch(async (req, res) => {
    console.log("Attempting to delete address with ID:", req.params.id); // Add this for debugging

    const address = await Address.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!address) {
        console.log("Address not found for ID:", req.params.id); // Log if address is not found
        return res.status(404).json({
            message: "Address not found",
        });
    }

    await address.deleteOne();

    console.log("Address deleted successfully:", address); // Log successful deletion

    res.json({
        message: "Address deleted successfully",
    });
});
