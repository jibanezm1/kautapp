import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Text, View, Image, ImageBackground, Platform, Button, TextInput, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QRScanner: React.FC = () => {
    const navigation = useNavigation(); // Obtener el objeto de navegación
    const [inputId, setInputId] = useState('');

    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const storedData = await AsyncStorage.getItem('apiData');
                if (storedData) {
                    // Datos encontrados en el almacenamiento, navegar a la pantalla "Vigilancia"
                    const data = JSON.parse(storedData);
                    navigation.navigate('Vigilancia', { data });
                }
            } catch (error) {
                console.error('Error retrieving data from storage:', error);
            }
        };

        checkStoredData();
    }, []);



    const saveDataToStorage = async (data: []) => {
        try {
            await AsyncStorage.setItem('apiData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data to storage:', error);
        }
    };

    const handleIdSubmit = () => {

        let headersList = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        let bodyContent = "campo1=" + inputId+"";
        let reqOptions = {
            url: "https://cautelapp.quotidian.cl/api/check",
            method: "POST",
            headers: headersList,
            data: bodyContent,
        }
        console.log(reqOptions);

        axios.request(reqOptions)
            .then(response => {
                if (response.data.success == true) {

                    saveDataToStorage(response.data);

                    // Navegar a la pantalla "Vigilancia"
                    navigation.navigate('Vigilancia', { data: response.data });
                } else {
                    Alert.alert(response.data.message)
                }
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <ImageBackground
            source={require('../../assets/backend.png')}
            style={{ flex: 1, alignItems: 'center' }}
        >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => {
                    // navigation.navigate('Location');
                }}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={{ width: 300, height: 300, marginBottom: 20 }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <View style={{ width: '60%', aspectRatio: 1 }}>
                    <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 20, color: "white", textAlign: 'center' }}>Ingresar RUC</Text>
                    <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, backgroundColor: 'white', borderRadius:10, marginBottom:10 }}
                        onChangeText={text => setInputId(text)}
                        value={inputId}
                    />
                    <Button 
                    color={"blue"}
                    title={'Ingresar a Cautelar'} 
                    onPress={handleIdSubmit} />
                </View>
                <Text style={{ fontSize: 12, marginTop: 20 }}>Desarrollado por Quotidian</Text>
            </View>
        </ImageBackground>
    );
};


export default QRScanner;
