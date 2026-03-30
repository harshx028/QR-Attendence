import api from "./axios"
import * as SecureStorage from "expo-secure-store"
const markAttendence = async (data: { token: string, checkIn?: true, checkOut?: true }) => {
    try {
        await api.post(`/api/v1/attendence/?token=${data.token}`)
        const date = new Date()
        const marked_status = {
            date: (new Date).toLocaleDateString(),
            checkIn: data.checkIn,
            checkOut: data?.checkOut || false,
        }
        await SecureStorage.setItemAsync("marked_status", JSON.stringify(marked_status))
        return true
    } catch (error) {
        return false
    }

}