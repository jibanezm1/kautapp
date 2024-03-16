import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState, Modal, PermissionsAndroid, Image, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { FloatingAction } from "react-native-floating-action";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import moment from "moment";
import { PROVIDER_GOOGLE } from 'react-native-maps';



const LOCATION_TASK_NAME = 'cautelar';
const FETCH_TASK_NAME = 'cautelar-segundo';


const sendRequest = async (latitude: any, longitude: any) => {
    const storedData = await AsyncStorage.getItem('apiData');
    if (storedData) {

        const data = JSON.parse(storedData);
        // Datos encontrados en el almacenamiento, navegar a la pantalla "Vigilancia"
        console.log(data);


        // Obtén la hora actual del dispositivo
        const currentDateTime = moment();
        const currentTime = currentDateTime.format('HH:mm:ss');
        var estaEnRango = false;
        // Obtén los valores de duracion_inicio y duracion_fin
        const duracionInicio = data.medida.duracion_inicio;
        const duracionFin = data.medida.duracion_fin;

        // Compara si currentTime está dentro del rango duracionInicio y duracionFin
        if (
            moment(currentTime, 'HH:mm:ss').isBetween(
                moment(duracionInicio, 'HH:mm:ss'),
                moment(duracionFin, 'HH:mm:ss'),
                null,
                '[]'
            )
        ) {
            estaEnRango = true;
            console.log('Está en el rango horario');
        } else {
            console.log('No está en el rango horario');
        }

        if (estaEnRango) {

            let headersList = {
                "Accept": "*/*",
                "User-Agent": "Thunder Client (https://www.thunderclient.com)",
                "Content-Type": "application/x-www-form-urlencoded"
            }

            // Puedes necesitar cambiar la forma de obtener el ID en esta función
            let reqOptions = {
                url: `https://cautelapp.quotidian.cl/api/verificacion?lan=${latitude}&lon=${longitude}&id=${data.cautelar.id}`,
                method: "GET",
                headers: headersList,
            }
            console.log(reqOptions);
            try {
                let response = await axios.request(reqOptions);
                console.log(response.data);
                return response.data.dentro;

            } catch (error) {
                console.error(error);
            }
        }


    }

};


interface VigilanciaProps {
    route: any; // Tipo de ruta (puedes ajustar el tipo según tu configuración de navegación)
}
const actions = [
    {
        text: "Enviar una fotografia",
        icon: require("../../assets/images/ic_videocam_white.png"),
        name: "bt_videocam",
        position: 4,
        name: 'screen2'
    },
    {
        text: "Salir de la aplicación",
        icon: require("../../assets/images/ic_videocam_white.png"),
        name: "bt_videocam",
        position: 4,
        name: 'salir'
    }
];



const Vigilancia: React.FC<VigilanciaProps> = ({ route }) => {
    const { data } = route.params;
    const cautelar = data.cautelar;
    const medida = data.medida;
    const [image, setImage] = useState(null);
    const [clickCount, setClickCount] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const clickCountRef = useRef(0);
    const navigation = useNavigation(); // Obtener el objeto de navegación
    const [isUploading, setIsUploading] = useState(false);

    const [estado, setEstado] = useState(null);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        enVivo(); // Ejecutar la función inicialmente

        // Ejecutar la función cada 5 minutos después
        const interval = setInterval(() => {
            enVivo();
        }, 9000); // 5 minutos en milisegundos (5 * 60 * 1000)

        // Limpiar el intervalo al desmontar el componente
        return () => clearInterval(interval);
    }, []); // La dependencia vacía [] asegura que solo se ejecute una vez al montar el componente


    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const storedData = await AsyncStorage.getItem('apiData');
                if (storedData) {
                    // Datos encontrados en el almacenamiento, navegar a la pantalla "Vigilancia"
                    const data = JSON.parse(storedData);

                }
            } catch (error) {
                console.error('Error retrieving data from storage:', error);
            }
        };

        checkStoredData();
    }, []);


    useFocusEffect(
        React.useCallback(() => {
            const onBeforeRemove = (e) => {
                e.preventDefault(); // Cancelar la acción de retorno
            };

            navigation.addListener('beforeRemove', onBeforeRemove);

            return () => {
                navigation.removeListener('beforeRemove', onBeforeRemove);
            };
        }, [])
    );

    const handleLogoClick = () => {
        enVivo();
        clickCountRef.current += 1;
        setClickCount(clickCountRef.current);
    };


    useEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <View style={styles.headerLogoContainer}>
                    <TouchableOpacity onPress={handleLogoClick}>
                        <Image source={require('../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
                    </TouchableOpacity>
                </View>
            ),

        });
    }, []);


    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Foreground location permission not granted');
        }

        const resultado = await Location.requestBackgroundPermissionsAsync();
        if (resultado.status !== 'granted') {
            throw new Error('Background location permission not granted');
        }

        registerBackgroundFetch();
        registerBackgroundLocation();
    }



    const registerBackgroundFetch = async () => {
        try {
            await BackgroundFetch.registerTaskAsync(FETCH_TASK_NAME, {
                minimumInterval: 900000, // 5 minutes
                stopOnTerminate: false,
                startOnBoot: true,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const registerBackgroundLocation = async () => {
        try {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 900000, // 5 seconds
                distanceInterval: 0,
                showsBackgroundLocationIndicator: false,
                pausesUpdatesAutomatically: false,
                foregroundService: {
                    notificationTitle: 'Location Tracking',
                    notificationBody: 'Location is being tracked in the background',
                },
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleActionPress = (name) => {
        console.log(name);
        if (name === 'salir') {

            var state = AsyncStorage.getAllKeys()
                .then(keys => AsyncStorage.multiRemove(keys));
            navigation.navigate('QRScanner');

            // navigation.navigate('Fotografia', { medida: data.medida });
        } else if (name === 'screen2') {
            openCamera();

        }
    };
    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status === 'granted') {

            const result = await ImagePicker.launchCameraAsync({
                quality: 0.5, // Reducir la calidad a la mitad (opcional, puedes ajustar este valor)
            });
            if (!result.canceled) {
                uploadPhoto(result.uri);
            }
        }
    };

    const uploadPhoto = async (uri) => {
        setIsUploading(true);

        const formData = new FormData();
        formData.append('photo', {
            uri: uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });
        formData.append('id_medida', cautelar.id);

        try {
            const response = await axios.post('https://cautelapp.quotidian.cl/api/control', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setIsUploading(false);

            // Maneja la respuesta de la API si es necesario
            response.data.success ? Alert.alert("Su reporte de ubicación fue enviado correctamente") : Alert.alert("Existen problemas para enviar la evidencia de la cautelar, por favor contactese urgentemente con el fiscal o encargado de seguimiento")
        } catch (error) {
            setIsUploading(false);

            // Maneja los errores si ocurre alguno durante la solicitud
            console.error(error);
        }
    };

    const enVivo: any = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;
            setLocation({ latitude, longitude });


        } else {
            console.log(status);
        }
    }


    const renderCautelarInfo = () => {

        return (

            <View style={styles.infoContainer}>

                <Text style={styles.title}>Información Cautelar</Text>
                <View style={styles.itemContainer}>
                    <Text style={styles.label}>RUC:</Text>
                    <Text style={styles.value}>{cautelar.ruc}</Text>
                </View>
                <View style={styles.itemContainer}>
                    <Text style={styles.label}>Fecha:</Text>
                    <Text style={styles.value}>{cautelar.fecha}</Text>
                </View>
                <View style={styles.itemContainer}>
                    <Text style={styles.label}>Origen:</Text>
                    <Text style={styles.value}>{cautelar.origen}</Text>
                </View>
                <View style={styles.itemContainer}>
                    <Text style={styles.label}>Destino:</Text>
                    <Text style={styles.value}>{cautelar.destino}</Text>
                </View>
                <View style={styles.itemContainer}>
                    <Text style={styles.label}>Fecha:</Text>
                    <Text style={styles.value}>{cautelar.fecha}</Text>
                </View>
                <View style={styles.itemContainer}>
                    <Text style={styles.label}>Mensaje:</Text>
                    <Text style={[styles.value, styles.truncatedText]} numberOfLines={12}>
                        {cautelar.mensaje}
                    </Text>
                </View>

                <View style={styles.itemContainer}>
                    <Text style={styles.label}>Objeto:</Text>
                    <Text style={styles.value}>{medida.tipo_cautelar}</Text>
                </View>
                {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}

                <TouchableOpacity
                    onPress={() => {
                        // sendRequest(111, 222);
                    }}
                >
                    <View>
                        {estado ? (
                            <Image source={require('../../assets/no.gif')} style={styles.gif} />
                        ) : (
                            <Image source={require('../../assets/ok.gif')} style={styles.gif} />
                        )}
                    </View>

                </TouchableOpacity>

                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: parseFloat(data.medida.lat) || 0,
                        longitude: parseFloat(data.medida.lon) || 0,
                        latitudeDelta: 0.016,
                        longitudeDelta: 0.016,
                    }}
                >
                    {location && (
                        <Marker
                            coordinate={{
                                latitude: location.latitude,
                                longitude: location.longitude,
                            }}
                            title="Ubicación en vivo"
                        />
                    )}
                    {medida && (
                        <Circle
                            center={{
                                latitude: parseFloat(data.medida.lat) || 0,
                                longitude: parseFloat(data.medida.lon) || 0,
                            }}
                            radius={medida.rango * 100} // Convertir el rango de kilómetros a metros
                            strokeWidth={2}
                            strokeColor="#FF0000"
                            fillColor="rgba(255,0,0,0.2)"
                        />
                    )}
                </MapView>



                {/* Agrega otros campos de la información cautelar según tus necesidades */}


            </View>
        );
    };

    return (
        <View style={{ paddingBottom: 60, backgroundColor: "#00aff8" }}>
            <ScrollView style={styles.container}>
                <Modal visible={isUploading} transparent={true} animationType="fade">
                    <View style={styles.modalContainer}>
                        <ActivityIndicator size="large" color="#ffffff" />
                    </View>
                </Modal>

                {renderCautelarInfo()}
                {/* Otro contenido de la pantalla Vigilancia */}

            </ScrollView>
            <FloatingAction
                actions={actions}
                overlayColor=" #0000ffcc"
                actionsPaddingTopBottom={15}
                onPressItem={handleActionPress}
                distanceToEdge={30}
            />
        </View>

    );
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error(error);
        return;
    }
    if (data) {
        const { locations } = data;
        const { latitude, longitude } = locations[0].coords;
        await sendRequest(latitude, longitude);
    }
});

TaskManager.defineTask(FETCH_TASK_NAME, async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = location.coords;
        await sendRequest(latitude, longitude);
    }
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 20,
        paddingBottom: 300
    },
    map: {
        height: 300,
        marginVertical: 10,
    },

    centrador: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ee6e73',
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    modalContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    infoContainer: {
        top: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    gif: {
        width: "100%",
        height: 100,
        alignSelf: 'center',
    },
    headerLogoContainer: {

        width: '100%',
        paddingLeft: 40
    },
    headerLogo: {
        width: 200,
        height: 80,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    label: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    truncatedText: {
        maxHeight: 100, // Ajusta la altura máxima según tus necesidades
        lineHeight: 18,
        textAlign: 'justify',
    },
    value: {
        flex: 1,
    },
});

export default Vigilancia;
